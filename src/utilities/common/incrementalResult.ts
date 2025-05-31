import type {
  ExecutionPatchIncrementalResult,
  ExecutionPatchInitialResult,
  ExecutionPatchResult,
  ApolloPayloadResult,
  FetchResult,
} from "../../link/core/index.js";
import { isNonNullObject } from "./objects.js";
import { isNonEmptyArray } from "./arrays.js";
<<<<<<< Updated upstream
import { DeepMerger, IS_APOLLO_INCREMENTAL_RESULT_DATA } from "./mergeDeep.js";
=======
import { DeepMerger, IS_APOLLO_INCREMENTAL_RESULT_LEAF } from "./mergeDeep.js";
>>>>>>> Stashed changes

export function isExecutionPatchIncrementalResult<T>(
  value: FetchResult<T>
): value is ExecutionPatchIncrementalResult {
  return "incremental" in value;
}

export function isExecutionPatchInitialResult<T>(
  value: FetchResult<T>
): value is ExecutionPatchInitialResult<T> {
  return "hasNext" in value && "data" in value;
}

export function isExecutionPatchResult<T>(
  value: FetchResult<T>
): value is ExecutionPatchResult<T> {
  return (
    isExecutionPatchIncrementalResult(value) ||
    isExecutionPatchInitialResult(value)
  );
}

// This function detects an Apollo payload result before it is transformed
// into a FetchResult via HttpLink; it cannot detect an ApolloPayloadResult
// once it leaves the link chain.
export function isApolloPayloadResult(
  value: unknown
): value is ApolloPayloadResult {
  return isNonNullObject(value) && "payload" in value;
}

export function mergeIncrementalDeferredData<TData extends object>(
  prevResult: TData,
  result: ExecutionPatchResult<TData>
) {
  let mergedData = prevResult;
  const merger = new DeepMerger();
  if (
    isExecutionPatchIncrementalResult(result) &&
    isNonEmptyArray(result.incremental)
  ) {
    result.incremental.forEach(({ data, path }) => {
      let dataToEmbed = data;

      // Only tag if the data is an object/array. Primitives don't need tagging
      // as the merge logic for primitives effectively replaces them anyway.
      if (isNonNullObject(data)) {
        // Shallow clone the data and tag it.
        const clonedAndTaggedData =
          Array.isArray(data) ? [...data] : { ...data };

        Object.defineProperty(
          clonedAndTaggedData,
          IS_APOLLO_INCREMENTAL_RESULT_DATA,
          {
            value: true,
            writable: false, // The value should not be changed
            enumerable: false,
            configurable: true, // Allows the property to be deleted if necessary
          }
        );
        dataToEmbed = clonedAndTaggedData as TData;
      }

      let reconstructedPathObject = dataToEmbed;
      for (let i = path.length - 1; i >= 0; --i) {
        const key = path[i];
        const isNumericKey = !isNaN(+key);
        const parent: Record<string | number, any> = isNumericKey ? [] : {};
        parent[key] = reconstructedPathObject;
        reconstructedPathObject = parent as typeof reconstructedPathObject;
      }

      mergedData = merger.mergeIncremental(mergedData, reconstructedPathObject);
    });
  }
  return mergedData as TData;
}

export function mergeIncrementalData<TData extends object>(
  prevResult: TData,
  result: ExecutionPatchResult<TData>
) {
  let mergedData = prevResult;
  const merger = new DeepMerger(); // DeepMerger needs to be aware of IS_APOLLO_PATCH_LEAF
  if (
    isExecutionPatchIncrementalResult(result) &&
    isNonEmptyArray(result.incremental)
  ) {
    result.incremental.forEach(({ data, path }) => {
      let dataToEmbed = data;

      // Only tag if the leaf data is an object/array. Primitives don't need tagging
      // as the merge logic for primitives effectively replaces them anyway.
      // The tag is primarily to stop deep recursion into what should be a replacement unit.
      if (isNonNullObject(data)) {
        // Shallow clone the leaf data and tag it.
        // This ensures the original patch data isn't mutated and the tag is specific to this merge context.
        const clonedAndTaggedLeafData =
          Array.isArray(data) ? [...data] : { ...data };

        Object.defineProperty(
          clonedAndTaggedLeafData,
          IS_APOLLO_INCREMENTAL_RESULT_LEAF,
          {
            value: true,
            writable: false, // The value should not be changed
            enumerable: false,
            configurable: true, // Allows the property to be deleted if necessary
          }
        );
        dataToEmbed = clonedAndTaggedLeafData as TData;
      }

      let reconstructedPathObject = dataToEmbed;
      for (let i = path.length - 1; i >= 0; --i) {
        const key = path[i];
        const isNumericKey = !isNaN(+key);
        const parent: Record<string | number, any> = isNumericKey ? [] : {};
        parent[key] = reconstructedPathObject;
        reconstructedPathObject = parent as typeof reconstructedPathObject;
      }

      mergedData = merger.merge(mergedData, reconstructedPathObject);
    });
  }
  return mergedData as TData;
}
